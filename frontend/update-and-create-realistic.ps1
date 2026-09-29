# REALISTIC - 97 courses = 3,756 lessons (3496 general + 260 witstart)
# Run inside frontend folder

$base = ".\data\lessons"
$coursesPath = ".\data\courses.json"

Write-Host "Step 1: Updating courses.json..." -ForegroundColor Yellow

$realistic = @{
    "ws_01" = @{ lessons=16; hours=10 }
    "ws_02" = @{ lessons=24; hours=18 }
    "ws_03" = @{ lessons=18; hours=14 }
    "ws_04" = @{ lessons=26; hours=20 }
    "ws_05" = @{ lessons=20; hours=15 }
    "ws_06" = @{ lessons=18; hours=12 }
    "ws_07" = @{ lessons=16; hours=12 }
    "ws_08" = @{ lessons=28; hours=22 }
    "ws_09" = @{ lessons=16; hours=12 }
    "ws_10" = @{ lessons=24; hours=18 }
    "ws_11" = @{ lessons=22; hours=18 }
    "ws_12" = @{ lessons=32; hours=28 }
}

$courses = Get-Content $coursesPath -Raw | ConvertFrom-Json
foreach ($c in $courses) {
    if ($realistic.ContainsKey($c.id)) {
        $r = $realistic[$c.id]
        $c.duration = "$($r.hours)h • $($r.lessons) lessons"
        if ($c.PSObject.Properties['lesson_count']) { $c.lesson_count = $r.lessons } else { $c | Add-Member -Name lesson_count -Value $r.lessons -MemberType NoteProperty }
        if ($c.PSObject.Properties['total_minutes']) { $c.total_minutes = $r.hours*60 } else { $c | Add-Member -Name total_minutes -Value ($r.hours*60) -MemberType NoteProperty }
    } else {
        if (-not $c.PSObject.Properties['lesson_count']) {
            if ($c.duration -match '(\d+)\s*lessons') { $c | Add-Member -Name lesson_count -Value ([int]$Matches[1]) -MemberType NoteProperty }
        }
    }
}
$courses | ConvertTo-Json -Depth 10 | Set-Content $coursesPath -Encoding UTF8

$totalGeneral = ($courses | Where-Object { -not $_.witstart } | Measure-Object -Property lesson_count -Sum).Sum
$totalWit = ($courses | Where-Object { $_.witstart } | Measure-Object -Property lesson_count -Sum).Sum
Write-Host "Updated: General $totalGeneral + Witstart $totalWit = $($totalGeneral+$totalWit)" -ForegroundColor Green

Write-Host "Step 2: Creating folders..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $base | Out-Null
function Slugify($s) { ($s.ToLower() -replace '[^a-z0-9]+','-' -replace '-+','-').Trim('-').Substring(0, [Math]::Min(50, ($s.ToLower() -replace '[^a-z0-9]+','-' -replace '-+','-').Trim('-').Length)) }

foreach ($c in $courses) {
    $slug = Slugify $c.title
    $folder = Join-Path $base "$($c.id)-$slug"
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    "# $($c.title)`nCourse: $($c.id)`nDuration: $($c.duration)`n" | Set-Content (Join-Path $folder "00-course-outline.md") -Encoding UTF8
    for ($i=1; $i -le $c.lesson_count; $i++) {
        $num = "{0:D2}" -f $i
        $file = Join-Path $folder "$num-lesson.md"
        if (-not (Test-Path $file)) {
            "# Lesson $num`nCourse: $($c.id)`nID: $($c.id)_l$num`n`nWrite complete explanatory notes here..." | Set-Content $file -Encoding UTF8
        }
    }
    Write-Host "Created $($c.id) - $($c.lesson_count) lessons"
}
Write-Host "DONE: 97 courses, $($totalGeneral+$totalWit) lessons" -ForegroundColor Green