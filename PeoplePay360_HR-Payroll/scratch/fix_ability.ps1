$file = 'c:\Users\01\OneDrive\Desktop\prompt\PeoplePay360_HR-Payroll\frontend\src\abilities\defineAbility.js'
$lines = Get-Content -Path $file
$newLines = foreach ($line in $lines) {
    if ($line -match "can\('read', \['schedule', 'payslip', 'contract'\]\);") {
        "      can('read', ['schedule', 'payslip']);"
    } else {
        $line
    }
}
$newLines | Set-Content -Path $file
Write-Output "DONE_UPDATE"
