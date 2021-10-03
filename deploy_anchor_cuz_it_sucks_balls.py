from get_project_root import root_path
import subprocess

project_root = root_path(ignore_cwd=False)
proc = subprocess.Popen(["anchor", "build"], shell=True)
proc.wait()


