#!/usr/bin/env python3
"""Create a portable source archive using an explicit allowlist; exclude runtime secrets."""
from pathlib import Path
import argparse, zipfile

root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,default=root.parent/'breslov-next-source.zip')
args=parser.parse_args()
files=['package.json','package-lock.json','next.config.ts','next-env.d.ts','tsconfig.json',
       'Dockerfile','.dockerignore','.gitignore','.env.example','README.md','playwright.config.ts']
folders=['src','public','content','docs','scripts','qa','deploy']
selected=[root/name for name in files if (root/name).is_file()]
for folder in folders:
    selected.extend(p for p in (root/folder).rglob('*') if p.is_file()
                    and '__pycache__' not in p.parts and p.suffix not in {'.pyc','.log'}
                    and not p.name.startswith('.env'))
args.output.parent.mkdir(parents=True,exist_ok=True)
temporary=args.output.with_suffix('.zip.tmp')
with zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for file in sorted(set(selected)):
        archive.write(file,Path('breslov-next')/file.relative_to(root))
temporary.replace(args.output)
print(f'Packaged {len(set(selected))} source files into {args.output}')
