<#
.SYNOPSIS
    Rend chaque skill du dépôt disponible dans tous les projets.

.DESCRIPTION
    Pour chaque sous-dossier qui contient un SKILL.md, crée une jonction dans les dossiers de
    skills que lisent les agents : ~/.claude/skills (Claude Code) et ~/.agents/skills (Codex et
    les autres agents compatibles). Une jonction, pas une copie : modifier un skill ici le
    modifie partout, sans rien réinstaller.

    Le script peut être relancé autant de fois qu'on veut :
      - il crée les liens manquants et laisse en place ceux qui sont déjà bons ;
      - il retire les liens qui pointent vers un skill du dépôt supprimé ou renommé ;
      - il ne touche jamais à un dossier qui ne vient pas du dépôt, il le signale.

    Il vérifie aussi l'en-tête de chaque SKILL.md : un skill mal déclaré n'est proposé par
    aucun agent, sans message d'erreur.

.EXAMPLE
    ./install.ps1

.EXAMPLE
    ./install.ps1 site-indexing custom-skills

.EXAMPLE
    ./install.ps1 -Targets "$HOME\.claude\skills"
#>
[CmdletBinding(PositionalBinding = $false)]
param(
    # Skills à installer ; tous par défaut. Noms séparés par des espaces ou des virgules.
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]] $Skills = @(),

    # Dossiers de skills à alimenter.
    [string[]] $Targets = @(
        (Join-Path $HOME '.claude\skills'),
        (Join-Path $HOME '.agents\skills')
    )
)

$ErrorActionPreference = 'Stop'
$repo = $PSScriptRoot.TrimEnd('\')
$problemCount = 0

function Write-Problem([string] $message) {
    Write-Host "  ! $message" -ForegroundColor Yellow
    $script:problemCount++
}

# Un skill = un sous-dossier qui contient un SKILL.md.
$available = @(Get-ChildItem -LiteralPath $repo -Directory |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'SKILL.md') })
$selected = $available
# Lancé avec -File, « a,b » arrive en une seule chaîne.
$Skills = @($Skills | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($Skills.Count) {
    $selected = @($available | Where-Object { $Skills -contains $_.Name })
    foreach ($unknown in $Skills | Where-Object { $available.Name -notcontains $_ }) {
        Write-Problem "$unknown : aucun skill de ce nom dans le dépôt"
    }
}

Write-Host "Skills du dépôt ($($selected.Count))"
foreach ($skill in $selected) {
    $text = Get-Content -LiteralPath (Join-Path $skill.FullName 'SKILL.md') -Raw -Encoding utf8
    $frontMatter = [regex]::Match($text, '(?s)\A---\r?\n(.*?)\r?\n---')
    if (-not $frontMatter.Success) {
        Write-Problem "$($skill.Name) : SKILL.md ne commence pas par un en-tête --- name / description ---"
        continue
    }
    $name = [regex]::Match($frontMatter.Groups[1].Value, '(?m)^name:\s*(.+?)\s*$').Groups[1].Value
    $description = [regex]::Match($frontMatter.Groups[1].Value, '(?m)^description:\s*(.+?)\s*$').Groups[1].Value
    if ($name -ne $skill.Name) {
        Write-Problem "$($skill.Name) : le champ name vaut « $name », il doit être le nom du dossier"
    }
    if (-not $description) {
        Write-Problem "$($skill.Name) : description absente, aucun agent ne saura quand s'en servir"
    }
    Write-Host "  · $($skill.Name)"
}

foreach ($target in $Targets) {
    Write-Host "`n$target"
    New-Item -ItemType Directory -Force -Path $target | Out-Null

    foreach ($skill in $selected) {
        $link = Join-Path $target $skill.Name
        $existing = Get-Item -LiteralPath $link -Force -ErrorAction SilentlyContinue
        if (-not $existing) {
            New-Item -ItemType Junction -Path $link -Target $skill.FullName | Out-Null
            Write-Host "  + $($skill.Name)" -ForegroundColor Green
        }
        elseif ($existing.LinkType -and (@($existing.Target)[0].TrimEnd('\') -eq $skill.FullName)) {
            Write-Host "  = $($skill.Name)" -ForegroundColor DarkGray
        }
        else {
            Write-Problem "$($skill.Name) : $link existe déjà et ne vient pas du dépôt, laissé tel quel"
        }
    }

    # Liens laissés par un skill supprimé ou renommé dans le dépôt.
    Get-ChildItem -LiteralPath $target -Directory -Force |
        Where-Object { $_.LinkType } |
        ForEach-Object {
            $linkTarget = @($_.Target)[0]
            $pointsIntoRepo = $linkTarget -and $linkTarget.StartsWith("$repo\", [StringComparison]::OrdinalIgnoreCase)
            if ($pointsIntoRepo -and -not (Test-Path -LiteralPath $linkTarget)) {
                # Supprime le lien lui-même, sans jamais descendre dans une cible.
                $_.Delete()
                Write-Host "  - $($_.Name) (n'existe plus dans le dépôt)" -ForegroundColor DarkYellow
            }
        }
}

if ($problemCount) {
    Write-Host "`n$problemCount point(s) à corriger." -ForegroundColor Yellow
    exit 1
}
Write-Host "`nTout est en place. Les nouveaux skills sont proposés dès la prochaine session." -ForegroundColor Green
