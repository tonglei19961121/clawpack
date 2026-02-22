# Changelog

All notable changes to this project will be documented in this file.

## [1.6.0] - 2024-02-23

### Added
- Interactive nickname prompt on first backup
- Auto-save profile when creating new Gist

### Changed
- Simplified CLI by removing `push` command (use `backup` instead)

## [1.5.0] - 2024-02-23

### Changed
- Removed `push` command, unified to `backup` command
- Updated README with clearer Quick Start for local pack and GitHub multi-config

## [1.4.0] - 2024-02-22

### Added
- Multi-profile management (nickname system)
- `clawpack profile` command family
- Use nicknames instead of Gist IDs

## [1.3.0] - 2024-02-22

### Added
- Local file backup (`pack`/`unpack` commands)
- No GitHub account required

## [1.2.0] - 2024-02-22

### Added
- `clawpack status` command to check auth status
- Better GitHub auth detection

## [1.1.0] - 2024-02-22

### Added
- Interactive wizard for `init` command
- Auto-detect GitHub CLI auth
- Smart hints after each command

## [1.0.0] - 2024-02-22

### Added
- Initial release
- GitHub Gist backup/restore
- Skill backup and restore
- Workspace files backup
