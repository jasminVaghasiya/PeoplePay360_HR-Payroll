$file = 'c:\Users\01\OneDrive\Desktop\prompt\PeoplePay360_HR-Payroll\frontend\src\components\Sidebar.jsx'
$tempFile = 'c:\Users\01\OneDrive\Desktop\prompt\PeoplePay360_HR-Payroll\scratch\Sidebar_temp.jsx'
$lines = Get-Content -Path $file
$newLines = foreach ($line in $lines) {
    if ($line -match "\s+const isAllowedByCasl = ability \? ability\.can\(item\.action, item\.subject\) : false;") {
        "          if (user.role === 'Employee' && item.id === 'contracts') return null;"
        $line
    } else {
        $line
    }
}
$newLines | Set-Content -Path $tempFile
Copy-Item -Path $tempFile -Destination $file -Force
Write-Output "SIDEBAR_UPDATE_SUCCESS"
