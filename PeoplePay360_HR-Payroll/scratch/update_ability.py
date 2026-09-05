import os

file_path = r'c:\Users\01\OneDrive\Desktop\prompt\PeoplePay360_HR-Payroll\frontend\src\abilities\defineAbility.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "can('read', ['schedule', 'payslip', 'contract']);"
replacement = "can('read', ['schedule', 'payslip']);"

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("TARGET NOT FOUND")
