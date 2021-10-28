if anchor build; then
  node --require ./babel-register.cjs --require ts-node/register --require @babel/register /home/source/escrow2/app/utils/generate_idl_typescript.ts
  if [ $1 ]; then anchor upgrade --program-id $1 target/deploy/unlucky.so
  fi
else
    echo "Command failed"
fi
node make_config.js

