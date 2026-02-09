# Changelog

## [0.1.7] - 2026-02-08
### Added
- **New Music Player**: Full-featured in-game music player accessible from the main menu.
- **Custom Music**: Users can now add their own local music files to the playlist.
- **Playlist Management**: Sequential playback, track controls (Play/Pause, Next/Prev), and volume control.
- **Visualizer**: Dynamic visualizer effect in the player UI.
- **Drag & Drop**: Support for adding local files directly to the music folder or via the "Add Music" button.

## [0.1.6] - 2026-02-07
### Improved
- **Seamless Joining**: Team members can now join a mission lobby immediately without selecting a role first.
- **Role Selection UX**: Clearer "Join" vs "Ready" state in the lobby.
- **Mission Sync**: Leader is automatically marked as ready when starting a contract.
- **Release**: Stability improvements for multiplayer sessions.

## [0.1.5] - 2026-02-07
### Added
- **Multiplayer Mission Sync**: Real-time synchronization of mission roles and readiness status for all team members.
- **Contract Joining**: "Join" button in chat allows instant joining of new contracts.
- **Role Selection**: Visual indicators when a mission role needs to be selected.
- **Improved Networking**: Better handling of connection events and error states.
- **Studio Invites**: Fully functional studio invite system in the Friends menu.

## [0.1.4] - 2026-02-06
### Added
- **Friend Code Fix**: Improved friend code matching to handle format differences (spaces, types).
- **Leave Studio**: Added functionality for members to leave a studio.
- **Global Real-time Status**: Users now see online/offline status updates for friends in real-time.
- **Improved Leaderboard**: Real-time updates for all players and studios.

## [0.1.3] - 2026-02-06
### Added
- **Logout Functionality**: Users can now log out, which clears their session and redirects to the profile creation screen.
- **Profile Redesign**: Complete overhaul of the profile modal.
  - Wider layout for desktop monitors.
  - Unlockable Roles (Junior, Middle, Senior, TeamLead, Architect) based on level and missions.
  - Visual indicators (lock icons, tooltips) for locked roles.
  - Fixed header with scrollable content area.
- **Real-time Studio Ratings**: Leaderboard now updates studio ratings in real-time.
- **Studio Leaderboard**: Studios are now listed in the leaderboard alongside players.

### Changed
- Updated `package.json` build output directory to `release_v14`.
