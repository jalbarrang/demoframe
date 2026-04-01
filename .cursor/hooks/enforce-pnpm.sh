#!/bin/bash
input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')

if [[ "$command" =~ ^npx[[:space:]] ]] || [[ "$command" == "npx" ]]; then
  cat << 'EOF'
{
  "permission": "deny",
  "agent_message": "npx is blocked in this project. Use 'pnpm exec' or 'pnpm dlx' instead. For example: 'pnpm exec tsc --noEmit' or 'pnpm exec svelte-check'."
}
EOF
elif [[ "$command" =~ ^npm[[:space:]] ]] || [[ "$command" == "npm" ]]; then
  cat << 'EOF'
{
  "permission": "deny",
  "agent_message": "npm is blocked in this project. Use pnpm instead. For example: 'pnpm add' instead of 'npm install', 'pnpm run dev' instead of 'npm run dev'."
}
EOF
else
  echo '{ "permission": "allow" }'
fi
