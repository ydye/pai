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

import React, {useRef, useContext, useState, useEffect} from 'react';
import {Modal, TextField, FontClassNames, PrimaryButton, DefaultButton, Stack, StackItem, Dropdown, mergeStyles, getTheme} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {isEmpty} from 'lodash';
import c from 'classnames';
import t from '../../../components/tachyons.scss';

import {createUserRequest, updateUserPasswordRequest, updateGrouplistRequest} from '../conn';
import {checkUsername, checkPassword, checkEmail} from '../utils';

import Context from './Context';

export default function UserEditor({user: {username = '', email = '', grouplist = []}, isOpen = false, isCreate = true, hide}) {
  const {allGroups, showMessageBox, refreshAllUsers} = useContext(Context);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const emailRef = useRef(null);

  const [groups, setGroups] = useState([]);
  useEffect(() => {
    setGroups(grouplist.slice());
  }, []);

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

    const newUsername = usernameRef.current.value;
    const newPassword = passwordRef.current.value;
    const newEmail = emailRef.current.value;

    if (isCreate) {
      const errorMessage = checkUsername(newUsername);
      if (errorMessage) {
        await showMessageBox(errorMessage);
        setLock(false);
        return;
      }
    }

    if (!isEmpty(newPassword) || isCreate) {
      const errorMessage = checkPassword(newPassword);
      if (errorMessage) {
        await showMessageBox(errorMessage);
        setLock(false);
        return;
      }
    }

    {
      const errorMessage = checkEmail(newEmail);
      if (errorMessage) {
        await showMessageBox(errorMessage);
        setLock(false);
        return;
      }
    }

    if (isCreate) {
      const result = await createUserRequest(newUsername, newEmail, newPassword, groups)
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
    } else {
      if (newPassword) {
        const result = await updateUserPasswordRequest(newUsername, newPassword)
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

      {
        const result = await updateGrouplistRequest(newUsername, groups)
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
    }

    await showMessageBox(isCreate ? 'Add new user successfully' : 'Update user information successfully');
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
            {isCreate ? 'Add new user' : 'Edit user'}
          </div>
          <div style={{margin: `${spacing.l1} 0px`}}>
            <table className={c(t.mlAuto, t.mrAuto)}>
              <tbody>
                <tr>
                  <td className={tdLabelStyle}>
                    Name
                </td>
                  <td className={tdPaddingStyle} style={{minWidth: '280px'}}>
                    <TextField
                      componentRef={usernameRef}
                      disabled={!isCreate}
                      defaultValue={username}
                      placeholder={isCreate ? 'Enter user name' : ''}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={tdLabelStyle}>
                    Password
                  </td>
                  <td className={tdPaddingStyle}>
                    <TextField
                      componentRef={passwordRef}
                      type='password'
                      placeholder={isCreate ? 'Enter password' : '******'}
                    />
                  </td>
                </tr>
                <tr>
                  <td className={tdLabelStyle}>
                    Email
                  </td>
                  <td className={tdPaddingStyle}>
                    <TextField
                      componentRef={emailRef}
                      defaultValue={email}
                      placeholder='Enter email'
                    />
                  </td>
                </tr>
                <tr>
                  <td className={tdLabelStyle}>
                    Groups
                  </td>
                  <td className={tdPaddingStyle}>
                    <Dropdown
                      multiSelect
                      options={groupsOptions}
                      selectedKeys={groups}
                      onChange={handleGroupsChanged}
                      placeholder='Select an option'
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
                  {isCreate ? 'Add' : 'Save'}
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

UserEditor.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    email: PropTypes.string,
    grouplist: PropTypes.array,
  }),
  isOpen: PropTypes.bool,
  isCreate: PropTypes.bool,
  hide: PropTypes.func,
};
