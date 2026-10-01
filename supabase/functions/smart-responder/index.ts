import { AwsClient } from "npm:aws4fetch@1.0.20";
import { createClient } from "npm:@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") || "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") || "minsplay-media-vault";
const R2_PUBLIC_DOMAIN = Deno.env.get("R2_PUBLIC_DOMAIN") || "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const r2Client = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  // 1. ACTION: SYNC (Crawls R2 and Upserts into Postgres)
  if (action === "sync") {
    try {
      let isTruncated = true;
      let continuationToken: string | null = null;
      let totalSynced = 0;

      while (isTruncated) {
        let listUrl = `${r2Endpoint}/${R2_BUCKET_NAME}?list-type=2&max-keys=100`;
        if (continuationToken) {
          listUrl += `&continuation-token=${encodeURIComponent(continuationToken)}`;
        }

        const s3Res = await r2Client.fetch(listUrl);
        const xml = await s3Res.text();

        isTruncated = xml.includes("<IsTruncated>true</IsTruncated>");
        continuationToken = xml.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/)?.[1] || null;

        const matches = xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g);
        const itemsToUpsert = [];

        for (const m of matches) {
          const block = m[1];
          const key = block.match(/<Key>(.*?)<\/Key>/)?.[1] || "";
          const size = parseInt(block.match(/<Size>(.*?)<\/Size>/)?.[1] || "0", 10);

          if (key && (key.endsWith(".mp4") || key.endsWith(".webm") || key.endsWith(".mov"))) {
            const publicUrl = R2_PUBLIC_DOMAIN
              ? `${R2_PUBLIC_DOMAIN}/${key}`
              : `${r2Endpoint}/${R2_BUCKET_NAME}/${key}`;

            const parts = key.split("/");
            const filename = parts.pop() || "";
            const folder = parts.pop() || "general";
            const title = folder.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

            itemsToUpsert.push({
              object_key: key,
              series_id: folder,
              filename,
              title,
              public_url: publicUrl,
              size_bytes: size,
              last_synced_at: new Date().toISOString(),
            });
          }
        }

        if (itemsToUpsert.length > 0) {
          const { error } = await supabase.from("r2_media_vault").upsert(itemsToUpsert, {
            onConflict: "object_key",
          });
          if (error) console.error("Database sync error:", error);
          totalSynced += itemsToUpsert.length;
        }

        if (!continuationToken) break;
      }

      return new Response(
        JSON.stringify({ success: true, message: `Synced ${totalSynced} items from R2! ⚡` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || "Failed to sync R2 bucket" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // 2. ACTION: GET (Paginated Feed)
  if (req.method === "GET") {
    try {
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "6", 10);
      const seriesId = url.searchParams.get("series_id");

      const offset = (page - 1) * limit;

      let query = supabase
        .from("r2_media_vault")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (seriesId && seriesId !== "all") {
        query = query.eq("series_id", seriesId);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasMore: offset + limit < (count || 0),
          items: data || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // 3. ACTION: POST (Presign Upload Token)
  try {
    const { filename, contentType, seriesId } = await req.json();
    const timestamp = Date.now();
    const cleanFileName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const objectKey = `episodes/${seriesId || "general"}/${timestamp}_${cleanFileName}`;
    const targetUrl = `${r2Endpoint}/${R2_BUCKET_NAME}/${objectKey}?X-Amz-Expires=900`;

    const signedRequest = await r2Client.sign(
      new Request(targetUrl, { method: "PUT", headers: { "Content-Type": contentType } }),
      { aws: { signQuery: true } }
    );

    const uploadUrl = signedRequest.url;
    const publicUrl = R2_PUBLIC_DOMAIN
      ? `${R2_PUBLIC_DOMAIN}/${objectKey}`
      : `${r2Endpoint}/${R2_BUCKET_NAME}/${objectKey}`;

    return new Response(
      JSON.stringify({ success: true, uploadUrl, publicUrl, objectKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
