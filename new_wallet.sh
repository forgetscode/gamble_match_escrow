rm /home/charlie/.config/solana/id$1.json
yes "" | solana-keygen new --outfile "/home/charlie/.config/solana/id$1.json"
solana config set -k "/home/charlie/.config/solana/id$1.json"
solana airdrop 5