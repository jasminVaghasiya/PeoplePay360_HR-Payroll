$f1 = "c:/Users/01/OneDrive/Desktop/prompt/PeoplePay360_HR-Payroll/frontend/src/abilities/defineAbility.js"
$tmp = "c:/Users/01/OneDrive/Desktop/prompt/PeoplePay360_HR-Payroll/frontend/src/abilities/defineAbility.js.tmp"
$c1 = [System.IO.File]::ReadAllText($f1)
$c1 = $c1.Replace("can('read', ['schedule', 'payslip', 'contract']);", "can('read', ['schedule', 'payslip']);")
[System.IO.File]::WriteAllText($tmp, $c1)
Move-Item -Path $tmp -Destination $f1 -Force
Write-Host "Replaced frontend defineAbility.js successfully"
