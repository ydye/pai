// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import React, {useContext, useState} from 'react';
import {Modal, FontClassNames, PrimaryButton, DefaultButton, Stack, StackItem, Dropdown, mergeStyles, getTheme} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../../components/tachyons.scss';

import {updateGrouplistRequest} from '../conn';

import Context from './Context';

export default function BatchGroupsEditor({isOpen = false, hide}) {
  const {allGroups, showMessageBox, refreshAllUsers, getSelectedUsers} = useContext(Context);

  const [groups, setGroups] = useState([]);

  const handleGroupsChanged = (_event, option, _index) => {
    if (option.selected) {
      groups.push(option.text);
    } else {
      groups.splice(groups.indexOf(option.text), 1);
    }
    setGroups(groups.slice());
  };

  const [lock, setLock] = useState(false);
  const [needRefreshAllUsers, setNeedRefreshAllUsers] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLock(true);

    const users = getSelectedUsers();
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const result = await updateGrouplistRequest(user.username, groups)
        .then(() => {
          setNeedRefreshAllUsers(true);
          return {success: true};
        })
        .catch((err) => {
          return {success: false, message: String(err)};
        });
      if (!result.success) {
        await showMessageBox(result.message);
        setLock(false);
        return;
      }
    }
    await showMessageBox('Update groups successfully');
    setLock(false);
    hide();
    refreshAllUsers();
  };

  const handleCancel = () => {
    hide();
    if (needRefreshAllUsers) {
      refreshAllUsers();
    }
  };

  const tdPaddingStyle = c(t.pa3);
  const tdLabelStyle = c(tdPaddingStyle, t.tr);

  /**
   * @type {import('office-ui-fabric-react').IDropdownOption[]}
   */
  const groupsOptions = allGroups.map((group) => {
    return {key: group, text: group};
  });

  const {spacing} = getTheme();

  return (
    <Modal
      isOpen={isOpen}
      isBlocking={true}
      containerClassName={mergeStyles({width: '450px', minWidth: '450px'})}
    >
      <div className={c(t.pa4)}>
        <form onSubmit={handleSubmit}>
          <div className={c(FontClassNames.mediumPlus)}>
            Batch Edit Groups
          </div>
          <div style={{margin: `${spacing.l1} 0px`}}>
            <table className={c(t.mlAuto, t.mrAuto)}>
              <tbody>
                <tr>
                  <td className={tdLabelStyle}>
                    Groups
                  </td>
                  <td className={tdPaddingStyle} style={{minWidth: '280px'}}>
                    <Dropdown
                      multiSelect
                      options={groupsOptions}
                      placeholder='Select an option'
                      onChange={handleGroupsChanged}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{marginTop: spacing.l2, marginLeft: 'auto', marginRight: 'auto'}}>
            <Stack horizontal={true} horizontalAlign='center' gap={spacing.s1}>
              <StackItem>
                <PrimaryButton type="submit" disabled={lock}>
                  Save
                </PrimaryButton>
              </StackItem>
              <StackItem>
                <DefaultButton disabled={lock} onClick={handleCancel}>
                  Cancel
                </DefaultButton>
              </StackItem>
            </Stack>
          </div>
        </form>
      </div>
    </Modal>
  );
}

BatchGroupsEditor.propTypes = {
  isOpen: PropTypes.bool,
  hide: PropTypes.func,
};
