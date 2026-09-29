# GENERATE LESSONS INDEX - Many-to-One ID assignment table
# Creates data/lessons_index.json with IDs like ws_01_l01, c_001_l01 etc.
# No orphan lesson allowed

$base = ".\data\lessons"
$indexPath = ".\data\lessons_index.json"
$coursesPath = ".\data\courses.json"

Write-Host "Scanning $base..." -ForegroundColor Yellow

$courses = Get-Content $coursesPath -Raw | ConvertFrom-Json
$index = @()

foreach ($c in $courses) {
    $slugPattern = "$($c.id)-*"
    $folders = Get-ChildItem $base -Directory | Where-Object { $_.Name -like $slugPattern }
    if ($folders.Count -eq 0) {
        Write-Host "WARNING: No folder for $($c.id)" -ForegroundColor Red
        continue
    }
    $folder = $folders[0].FullName
    $mdFiles = Get-ChildItem $folder -File | Where-Object { $_.Name -ne "00-course-outline.md" -and $_.Name -like "*.md" } | Sort-Object Name

    $order = 1
    foreach ($file in $mdFiles) {
        $num = "{0:D2}" -f $order
        $lessonId = "$($c.id)_l$num"
        # Estimate minutes from file size (if you already wrote notes, this becomes real)
        $words = (Get-Content $file.FullName -Raw).Split().Count
        $minutes = [Math]::Max(5, [Math]::Round($words / 180))
        if ($minutes -lt 5) { $minutes = 10 } # default for empty files

        $obj = [PSCustomObject]@{
            id = $lessonId
            courseId = $c.id
            title = ($file.BaseName -replace '^\d+-','' -replace '-',' ').Trim()
            order = $order
            file = "data/lessons/$($folders[0].Name)/$($file.Name)"
            estimated_minutes = $minutes
            witstart = $c.witstart
        }
        $index += $obj
        $order++
    }
    Write-Host "Indexed $($c.id) - $($mdFiles.Count) lessons" -ForegroundColor Gray
}

$index | ConvertTo-Json -Depth 5 | Set-Content $indexPath -Encoding UTF8

# Now update courses.json with REAL counts from actual files
foreach ($c in $courses) {
    $lessons = $index | Where-Object { $_.courseId -eq $c.id }
    if ($lessons.Count -gt 0) {
        $totalMin = ($lessons | Measure-Object -Property estimated_minutes -Sum).Sum
        $hours = [Math]::Round($totalMin / 60, 1)
        $c.duration = "$hours`h • $($lessons.Count) lessons"
        $c.lesson_count = $lessons.Count
        $c.total_minutes = $totalMin
    }
}
$courses | ConvertTo-Json -Depth 10 | Set-Content $coursesPath -Encoding UTF8

$total = $index.Count
$witTotal = ($index | Where-Object { $_.witstart }).Count
$genTotal = $total - $witTotal

Write-Host ""
Write-Host "DONE: lessons_index.json created" -ForegroundColor Green
Write-Host "Total: $total lessons (General $genTotal + Witstart $witTotal)" -ForegroundColor Green
Write-Host "File: $indexPath" -ForegroundColor Cyan
Write-Host "Updated: $coursesPath with real durations" -ForegroundColor Cyan
Write-Host ""
Write-Host "Many-to-One Check:" -ForegroundColor Yellow
Write-Host "- Each lesson has exactly ONE courseId (no orphans)" -ForegroundColor Gray
Write-Host "- ID format: <courseId>_l<order> e.g. ws_01_l01, c_001_l01" -ForegroundColor Gray
Write-Host "- Next: Use lessons_index.json for dashboard progress tracking" -ForegroundColor Gray