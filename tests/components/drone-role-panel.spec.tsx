import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DroneRolePanel } from '../../src/components/DroneRolePanel';
import { useStore } from '../../src/state/store';
import { createEmptyDroneRoleTargets } from '../../src/utils/droneRoles';

describe('DroneRolePanel', () => {
  beforeEach(() => {
    useStore.setState({
      droneCount: 0,
      manualDroneRoleTargets: createEmptyDroneRoleTargets(),
    });
  });

  it('shows effective role totals with auto-fill distribution', () => {
    useStore.setState({ droneCount: 5 });

    render(<DroneRolePanel />);

    const minerRow = screen.getByTestId('drone-role-row-MINER');
    const builderRow = screen.getByTestId('drone-role-row-BUILDER');
    const explorerRow = screen.getByTestId('drone-role-row-EXPLORER');

    expect(within(minerRow).getByText('0 manual · 2 auto')).toBeInTheDocument();
    expect(within(minerRow).getByText('2 total')).toBeInTheDocument();
    expect(within(builderRow).getByText('0 manual · 2 auto')).toBeInTheDocument();
    expect(within(builderRow).getByText('2 total')).toBeInTheDocument();
    expect(within(explorerRow).getByText('0 manual · 1 auto')).toBeInTheDocument();
    expect(within(explorerRow).getByText('1 total')).toBeInTheDocument();
  });

  it('updates manual role targets when plus and minus buttons are clicked', () => {
    useStore.setState({ droneCount: 3 });

    render(<DroneRolePanel />);

    fireEvent.click(screen.getByRole('button', { name: /Increase explorer target/i }));

    expect(useStore.getState().manualDroneRoleTargets).toEqual({
      MINER: 0,
      BUILDER: 0,
      EXPLORER: 1,
    });

    const explorerRow = screen.getByTestId('drone-role-row-EXPLORER');
    expect(within(explorerRow).getByText('1 manual · 0 auto')).toBeInTheDocument();
    expect(within(explorerRow).getByText('1 total')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Decrease explorer target/i }));

    expect(useStore.getState().manualDroneRoleTargets).toEqual(createEmptyDroneRoleTargets());
  });

  it('does not allow the plus controls to exceed the total drone pool', () => {
    useStore.setState({ droneCount: 1 });

    render(<DroneRolePanel />);

    fireEvent.click(screen.getByRole('button', { name: /Increase miner target/i }));
    fireEvent.click(screen.getByRole('button', { name: /Increase builder target/i }));

    expect(useStore.getState().manualDroneRoleTargets).toEqual({
      MINER: 1,
      BUILDER: 0,
      EXPLORER: 0,
    });
  });
});