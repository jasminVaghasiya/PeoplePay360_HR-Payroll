$f1 = "c:/Users/01/OneDrive/Desktop/prompt/PeoplePay360_HR-Payroll/frontend/src/abilities/defineAbility.js"
$c1 = [System.IO.File]::ReadAllText($f1)
$c1 = $c1.Replace("can('read', ['schedule', 'payslip', 'contract']);", "can('read', ['schedule', 'payslip']);")
[System.IO.File]::WriteAllText($f1, $c1)
Write-Host "Updated frontend defineAbility.js"

$f2 = "c:/Users/01/OneDrive/Desktop/prompt/PeoplePay360_HR-Payroll/backend/modules/access-control/abilities/defineAbility.js"
$c2 = [System.IO.File]::ReadAllText($f2)
$c2 = $c2.Replace("SUBJECTS.PAYSLIP, SUBJECTS.CONTRACT", "SUBJECTS.PAYSLIP")
[System.IO.File]::WriteAllText($f2, $c2)
Write-Host "Updated backend defineAbility.js"
