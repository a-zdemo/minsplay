import re

email_input = input("Enter your login email: ").strip().lower()
if not email_input:
    print("Email cannot be empty.")
    exit(1)

with open("public/js/auth.js", "r", encoding="utf-8") as f:
    code = f.read()

# Add email to recognized Super Admin list
if email_input not in code:
    code = code.replace(
        'const INITIAL_SUPER_ADMINS = [',
        f'const INITIAL_SUPER_ADMINS = ["{email_input}", '
    )
    with open("public/js/auth.js", "w", encoding="utf-8") as f:
        f.write(code)
    print(f"✓ {email_input} registered as Super Admin in public/js/auth.js")
else:
    print(f"{email_input} is already listed as Super Admin.")
