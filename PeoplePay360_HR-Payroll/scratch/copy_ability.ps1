$file = 'c:\Users\01\OneDrive\Desktop\prompt\PeoplePay360_HR-Payroll\frontend\src\abilities\defineAbility.js'
$tempFile = 'c:\Users\01\OneDrive\Desktop\prompt\PeoplePay360_HR-Payroll\scratch\defineAbility_temp.js'
$lines = Get-Content -Path $file
$newLines = foreach ($line in $lines) {
    if ($line -match "can\('read', \['schedule', 'payslip', 'contract'\]\);") {
        "      can('read', ['schedule', 'payslip']);"
    } else {
        $line
    }
}
$newLines | Set-Content -Path $tempFile
Copy-Item -Path $tempFile -Destination $file -Force
Write-Output "TEMP_COPY_SUCCESS"
