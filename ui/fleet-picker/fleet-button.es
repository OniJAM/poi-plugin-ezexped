import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Tooltip as RTooltip,
  OverlayTrigger as ROverlayTrigger,
} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import styled from 'styled-components'
import { Button, Position } from '@blueprintjs/core'

import { Popover, Tooltip } from 'views/components/etc/overlay'
import { PTyp } from '../../ptyp'
import { __ } from '../../tr'
import { mapDispatchToProps } from '../../store'
import {
  fleetIdSelector,
  mkFleetInfoSelector,
} from '../../selectors'
import {
  fleetStateSelector,
} from './selectors'


import {
  FleetTooltipContent,
} from './fleet-tooltip-content'

import {
  FleetState,
} from './fleet-state'

const FPButton = styled(Button)`
  & > span.bp3-button-text {
    display: flex;
    align-items: center;
    width: 100%;
  }
`

const FTooltip = styled(Tooltip)`
  flex: 1 0;

  & > .bp3-popover-target {
    width: 100%;
  }
`

@connect(
  (state, props) => {
    const {fleetId} = props
    const currentFocusingFleetId = fleetIdSelector(state)
    const fleet = mkFleetInfoSelector(fleetId)(state)
    const fleetState = fleetStateSelector(fleetId)(state)
    return {
      focused: fleetId === currentFocusingFleetId,
      fleet,
      fleetState,
    }
  },
  mapDispatchToProps,
)
class FleetButton extends Component {
  static propTypes = {
    focused: PTyp.bool.isRequired,
    fleetId: PTyp.number.isRequired,
    fleet: PTyp.object,
    fleetState: PTyp.object.isRequired,
    // connected
    changeFleet: PTyp.func.isRequired,
    changeFleetFocusInMainUI: PTyp.func.isRequired,
  }

  static defaultProps = {
    fleet: null,
  }

  handleFocusFleetInMainUI = () => {
    const {fleetId, changeFleetFocusInMainUI} = this.props
    changeFleetFocusInMainUI(fleetId)
  }

  handleChangeFleet = () => {
    const {fleetId, changeFleet} = this.props
    changeFleet(fleetId)
  }

  render() {
    const {fleet, focused, fleetState} = this.props
    const intent = FleetState.intent(fleetState)
    const fleetStateDesc = FleetState.describe(fleetState)
    const shouldHide = fleetState.type === 'Main' && fleetState.shouldHide
    const content = (
      <FPButton
        className="ezexped-fleet-picker-button"
        intent={intent}
        style={{
          flex: 1,
          opacity: focused ? 1 : .5,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
        active={focused}
        onContextMenu={this.handleFocusFleetInMainUI}
        onClick={this.handleChangeFleet}
        text={(
          <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
            <span style={{
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              textAlign: 'center',
            }}>
              {fleet ? fleet.name : __('FleetState.NotAvail')}
            </span>
            {
              shouldHide && (
                <FontAwesome
                  style={{marginLeft: '.2em'}}
                  name="ban"
                />
              )
            }
          </div>
        )}
      />
    )

    return fleet ? (
      <FTooltip
        content={(
          <FleetTooltipContent
            stateContent={fleetStateDesc}
            fleet={fleet}
          />
        )}
        position={Position.BOTTOM}
      >
        {content}
      </FTooltip>
    ) : content
  }
}

export { FleetButton }
