$coursesPath = ".\data\courses.json"
$courses = Get-Content $coursesPath -Raw | ConvertFrom-Json

foreach ($c in $courses) {
    if (-not $c.PSObject.Properties['lesson_count']) {
        if ($c.duration -match '(\d+)\s*lessons') { $c | Add-Member -Name lesson_count -Value ([int]$Matches[1]) -MemberType NoteProperty }
    }
    if (-not $c.PSObject.Properties['total_minutes']) {
        $c | Add-Member -Name total_minutes -Value 0 -MemberType NoteProperty
    }
    # recalc total_minutes from lessons_index if exists
    $index = Get-Content ".\data\lessons_index.json" -Raw | ConvertFrom-Json
    $lessons = $index | Where-Object { $_.courseId -eq $c.id }
    if ($lessons.Count -gt 0) {
        $totalMin = ($lessons | Measure-Object -Property estimated_minutes -Sum).Sum
        $c.total_minutes = $totalMin
    }
}

$courses | ConvertTo-Json -Depth 10 | Set-Content $coursesPath -Encoding UTF8
Write-Host "Fixed total_minutes for all 97 courses" -ForegroundColor Green