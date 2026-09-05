$f = "c:/Users/01/OneDrive/Desktop/prompt/PeoplePay360_HR-Payroll/frontend/src/context/AuthContext.jsx"
$tmp = "$f.tmp"
$txt = [System.IO.File]::ReadAllText($f)
$txt = $txt.Replace('/auth/users/${userId}/role', '`/auth/users/${userId}/role`')
[System.IO.File]::WriteAllText($tmp, $txt)
Move-Item -Path $tmp -Destination $f -Force
Write-Host "Fixed backticks in AuthContext.jsx"
