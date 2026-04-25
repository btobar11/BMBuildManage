import sys

file_path = r'c:\Users\benja\OneDrive\Escritorio\BMBuildManage\apps\web\src\App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "import { PricingPage }" in line:
        new_lines.append(line)
        new_lines.append("import { SuccessPage } from './features/billing/SuccessPage';\n")
        new_lines.append("import { FailurePage } from './features/billing/FailurePage';\n")
        new_lines.append("import { PendingPage } from './features/billing/PendingPage';\n")
    elif 'path="/pricing"' in line:
        new_lines.append(line)
        # Find the next line which should be the element
        continue 
    elif 'element={<PricingPage />}' in line and any('path="/pricing"' in prev for prev in new_lines[-2:]):
        new_lines.append(line)
        new_lines.append('        <Route path="/billing/success" element={<SuccessPage />} />\n')
        new_lines.append('        <Route path="/billing/failure" element={<FailurePage />} />\n')
        new_lines.append('        <Route path="/billing/pending" element={<PendingPage />} />\n')
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File updated successfully")
