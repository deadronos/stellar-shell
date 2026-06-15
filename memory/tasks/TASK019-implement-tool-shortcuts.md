# TASK019 — Implement Documented Keyboard Tool Shortcuts

## Goal

Wire the `1` and `2` keys to switch between Laser and Build tools, as documented in `README.md`.

## Background

`README.md` lists:
- `1`: Select Laser tool
- `2`: Select Frame tool

`PlayerController.tsx` currently handles WASD movement, Space/Shift vertical movement, mouse look, left-click mine, and right-click build, but does not handle numeric key tool selection.

## Implementation

1. In `src/components/PlayerController.tsx`, add `Digit1` and `Digit2` handling in the existing keyboard event listener.
2. Call `useStore.getState().setTool('LASER')` for `Digit1` and `useStore.getState().setTool('BUILD')` for `Digit2`.
3. Ensure the action is only triggered on keydown, not repeated key presses.
4. Add a test in `tests/components/player-controller.spec.tsx` verifying the store tool changes when `Digit1`/`Digit2` keydown events fire.

## Acceptance Criteria

- [ ] Pressing `1` sets the selected tool to `LASER`.
- [ ] Pressing `2` sets the selected tool to `BUILD`.
- [ ] Existing movement and mouse controls remain unaffected.
- [ ] New behavior is covered by a passing unit test.

## Design

DES011-maintenance-fixes-bundle
