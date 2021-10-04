import subprocess
import os
import json
import argparse
from subprocess import PIPE, Popen

cwd = os.getcwd()

parser = argparse.ArgumentParser()
parser.add_argument('redeploy', help='redeploy program from scratch', default=None, nargs='?')
args = parser.parse_args()

def get_balance():
    with Popen("solana balance", stdout=PIPE, stderr=None, shell=True) as process:
        output = process.communicate()[0].decode("utf-8")
    return float(output.split(" ")[0])

if get_balance() < 15:
    proc = subprocess.Popen("solana airdrop 15", shell=True)
    proc.wait()

def get_program_id(kind="json", is_second=False):
    if kind == "json":
        path = "target/idl"
        fns = [f"{path}/{x}" for x in os.listdir(path)]
        if len(fns) < 1:
            raise FileNotFoundError()
        with open(fns[0], "r", encoding="utf-8") as fp:
            idl_data = json.load(fp)
        try:
            program_id = idl_data["metadata"]["address"]
        except KeyError as e:
            if not is_second:
                return get_program_id("toml", is_second=True)
            raise e
        return program_id
    else:
        anchor_toml_fn = "Anchor.toml"
        with open(anchor_toml_fn, "r", encoding="utf-8") as anchor_fp:
            anchor_toml_data = anchor_fp.read()
        for line in anchor_toml_data.split("\n"):
            if line.startswith("gamble_match_escrow"):
                return line.split("=")[-1].strip().replace('"', "")
        raise Exception


def redeploy_program():
    # pop = Popen("cargo clean", shell=True)
    pop = Popen("anchor build", shell=True)
    pop.wait()
    should_continue = input("continue? [Y/N]")
    if not should_continue.strip().lower().startswith("y"):
        exit(1)
    bal_before = get_balance()
    pop = Popen("anchor deploy", shell=True)
    pop.wait()
    print(f"deploy cost: {bal_before - get_balance()} SOL")
    # proc = subprocess.Popen(command, shell=True)
    program_id = get_program_id()
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
    return program_id

def rebuild_program():
    command = f"anchor build"
    proc = subprocess.Popen(command, shell=True)
    proc.wait()

if args.redeploy is not None:
    program_id = redeploy_program()
else:
    rebuild_program()
    program_id = get_program_id("toml")

bal_before = get_balance()
command = f"anchor upgrade target/deploy/gamble_match_escrow.so --program-id {program_id}"

proc = subprocess.Popen(command, shell=True)
proc.wait()
print(f"upgrade cost: {bal_before - get_balance()} SOL")

print("deployed successfully!")