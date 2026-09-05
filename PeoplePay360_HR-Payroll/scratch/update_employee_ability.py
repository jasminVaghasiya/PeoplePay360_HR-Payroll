import re

f1 = r'frontend/src/abilities/defineAbility.js'
with open(f1, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("can('read', ['schedule', 'payslip', 'contract']);", "can('read', ['schedule', 'payslip']);")
with open(f1, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated frontend defineAbility.js")

f2 = r'backend/modules/access-control/abilities/defineAbility.js'
with open(f2, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("SUBJECTS.PAYSLIP, SUBJECTS.CONTRACT", "SUBJECTS.PAYSLIP")
with open(f2, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated backend defineAbility.js")
