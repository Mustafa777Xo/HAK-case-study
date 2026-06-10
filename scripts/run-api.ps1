$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Runner = Join-Path $ScriptDir "run-api.py"
$RootDir = Split-Path -Parent $ScriptDir
$VenvPython = Join-Path $RootDir "api\.venv\Scripts\python.exe"

if (Test-Path $VenvPython) {
    & $VenvPython $Runner @args
    exit $LASTEXITCODE
}

if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 $Runner @args
    exit $LASTEXITCODE
}

& python $Runner @args
exit $LASTEXITCODE
