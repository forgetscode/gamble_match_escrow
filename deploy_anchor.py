import subprocess
import os
import json
cwd = os.getcwd()

from subprocess import PIPE, Popen

with Popen("solana balance", stdout=PIPE, stderr=None, shell=True) as process:
    output = process.communicate()[0].decode("utf-8")
output = float(output.split(" ")[0])

airdrop_cmd = "solana airdrop 5 && " if output < 3 else ""
command = f"{airdrop_cmd}anchor build && anchor deploy"

proc = subprocess.Popen(command, shell=True)
proc.wait()

path = "target/idl"
fns = [f"{path}/{x}" for x in os.listdir(path)]
if len(fns) < 1:
    raise FileNotFoundError()
with open(fns[0], "r", encoding="utf-8") as fp:
    idl_data = json.load(fp)


try:
    program_id = idl_data["metadata"]["address"]
except KeyError as e:
    raise e

lib_fn = "programs/gamble_match_escrow/src/lib.rs"
with open(lib_fn, "r", encoding="utf-8") as rust_fp:
    rust_data = rust_fp.read()
new_lines = []
for line in rust_data.split("\n"):
    if not line.startswith("declare_id!"):
        new_lines.append(line)
        continue
    new_lines.append(f"declare_id!(\"{program_id}\");")
with open(lib_fn, "w", encoding="utf-8") as rust_fp:
    rust_fp.write("\n".join(new_lines))

anchor_toml_fn = "Anchor.toml"
with open(anchor_toml_fn, "r", encoding="utf-8") as anchor_fp:
    anchor_toml_data = anchor_fp.read()
new_lines = []
for line in anchor_toml_data.split("\n"):
    if not line.startswith("gamble_match_escrow"):
        new_lines.append(line)
        continue
    new_lines.append(f"gamble_match_escrow = \"{program_id}\"")
with open(anchor_toml_fn, "w", encoding="utf-8") as anchor_fp:
    anchor_fp.write("\n".join(new_lines))
print(idl_data)

command = f"anchor upgrade target/deploy/gamble_match_escrow.so --program-id {program_id}"

proc = subprocess.Popen(command, shell=True)
proc.wait()

print("deployed successfully!")