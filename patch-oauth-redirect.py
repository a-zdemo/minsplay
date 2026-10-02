with open("public/js/app.js", "r", encoding="utf-8") as f:
    code = f.read()

if "handleOAuthCallback" not in code:
    code = 'import { handleOAuthCallback } from "./auth.js";\n' + code

if "handleOAuthCallback();" not in code:
    code = code.replace("function startApp() {", "function startApp() {\n    handleOAuthCallback();")

with open("public/js/app.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated public/js/app.js with global OAuth session handler ✓")
