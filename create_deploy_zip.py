import zipfile
import os

zip_name = 'produccion_deploy.zip'
exclude_dirs = {'node_modules', '.git', '.firebase'}

with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f == zip_name or f.endswith('.zip'):
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, '.')
            z.write(full_path, rel_path)

size_mb = os.path.getsize(zip_name) / (1024 * 1024)
print(f"Zip creado exitosamente: {zip_name} ({size_mb:.2f} MB)")
