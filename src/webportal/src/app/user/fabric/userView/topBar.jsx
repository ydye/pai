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

import React, {useContext, useMemo, useState} from 'react';

import {CommandBarButton} from 'office-ui-fabric-react/lib/Button';
import {SearchBox} from 'office-ui-fabric-react/lib/SearchBox';
import {CommandBar} from 'office-ui-fabric-react/lib/CommandBar';
import {ContextualMenuItemType} from 'office-ui-fabric-react/lib/ContextualMenu';
import {findIndex} from 'lodash';

import Context from './context';
import Filter from './filter';
import {toBool} from './utils';

/* eslint-disable react/prop-types */
function FilterButton({defaultRender: Button, ...props}) {
  const {subMenuProps: {items}} = props;
  const checkedItems = items.filter((item) => item.checked).map((item) => item.text);
  const checkedText = checkedItems.length === 0 ? null
    : checkedItems.length === 1 ? <strong>{checkedItems[0]}</strong>
      : <strong>{checkedItems[0]}{` (+${checkedItems.length - 1})`}</strong>;
  return (
    <Button {...props}>
      {checkedText}
    </Button>
  );
}

function KeywordSearchBox() {
  const {filter, setFilter} = useContext(Context);
  function onKeywordChange(keyword) {
    const {admins, virtualClusters} = filter;
    setFilter(new Filter(keyword, admins, virtualClusters));
  }

  /** @type {import('office-ui-fabric-react').IStyle} */
  const rootStyles = {backgroundColor: 'transparent', alignSelf: 'center', width: 220};
  return (
    <SearchBox
      underlined
      placeholder="Filter by keyword"
      styles={{root: rootStyles}}
      value={filter.keyword}
      onChange={onKeywordChange}
    />
  );
}
/* eslint-enable react/prop-types */

function TopBar() {
  const [active, setActive] = useState(true);
  const {allUsers, refreshAllUsers, getSelectedUsers, filter, setFilter, addUser, importCSV, removeUsers} = useContext(Context);

  const {admins, virtualClusters} = useMemo(() => {
    const admins = Object.create(null);
    const virtualClusters = Object.create(null);

    if (allUsers !== null) {
      allUsers.forEach(function(user) {
        admins[String(user.admin)] = true;
        if (user.virtualCluster) {
          const vcs = user.virtualCluster.split(',');
          vcs.forEach((vc) => {
            virtualClusters[vc] = true;
          });
        }
      });
    }

    return {admins, virtualClusters};
  }, [allUsers]);

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getAddUser() {
    return {
      key: 'addUser',
      name: 'Add User',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconProps: {
        iconName: 'Add',
      },
      onClick: addUser,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getImportCSV() {
    return {
      key: 'importCSV',
      name: 'Import CSV',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconProps: {
        iconName: 'Stack',
      },
      onClick: importCSV,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getRemove() {
    return {
      key: 'remove',
      name: 'Remove',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconProps: {
        iconName: 'UserRemove',
      },
      onClick: removeUsers,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getRefresh() {
    return {
      key: 'refresh',
      name: 'Refresh',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconProps: {
        iconName: 'Refresh',
      },
      onClick: refreshAllUsers,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getKeyword() {
    return {
      key: 'keyword',
      commandBarButtonAs: KeywordSearchBox,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getFilters() {
    return {
      key: 'filters',
      name: 'Filters',
      iconProps: {iconName: 'Filter'},
      menuIconProps: {iconName: active ? 'ChevronUp' : 'ChevronDown'},
      onClick() {
        setActive(!active);
      },
      onRender(item) {
        return (
          <CommandBarButton
            onClick={item.onClick}
            iconProps={item.iconProps}
            menuIconProps={item.menuIconProps}
            styles={{root: {backgroundColor: 'transparent'}}}
          >
            Filters
          </CommandBarButton>
        );
      },
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getClear() {
    return {
      key: 'clear',
      name: 'Clear',
      buttonStyles: {root: {backgroundColor: 'transparent', height: '100%'}},
      iconOnly: true,
      iconProps: {
        iconName: 'Cancel',
      },
      onClick() {
        setFilter(new Filter());
        setActive(false);
      },
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getAdmin() {
    /**
     * @param {React.SyntheticEvent} event
     * @param {import('office-ui-fabric-react').IContextualMenuItem} item
     */
    function onClick(event, {key, checked}) {
      event.preventDefault();
      const {keyword, virtualClusters} = filter;
      const admins = new Set(filter.admins);
      if (checked) {
        admins.delete(key);
      } else {
        admins.add(key);
      }
      setFilter(new Filter(keyword, admins, virtualClusters));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const {keyword, virtualClusters} = filter;
      setFilter(new Filter(keyword, new Set(), virtualClusters));
    }

    /**
     * @param {string} key
     * @param {string} text
     * @returns {import('office-ui-fabric-react').IContextualMenuItem}
     */
    function getItem(key) {
      return {
        key,
        text: toBool(key) ? 'Yes' : 'No',
        canCheck: true,
        checked: filter.admins.has(key),
        onClick: onClick,
      };
    }

    return {
      key: 'admin',
      text: 'Admin',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {
        iconName: 'Clock',
      },
      subMenuProps: {
        items: Object.keys(admins).map(getItem).concat([{
          key: 'divider',
          itemType: ContextualMenuItemType.Divider,
        },
        {
          key: 'clear',
          text: 'Clear',
          onClick: onClearClick,
        },
        ]),
      },
      commandBarButtonAs: FilterButton,
    };
  }

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getVirtualCluster() {
    /**
     * @param {React.SyntheticEvent} event
     * @param {import('office-ui-fabric-react').IContextualMenuItem} item
     */
    function onClick(event, {key, checked}) {
      event.preventDefault();
      const {keyword, admins} = filter;
      const virtualClusters = new Set(filter.virtualClusters);
      if (checked) {
        virtualClusters.delete(key);
      } else {
        virtualClusters.add(key);
      }
      setFilter(new Filter(keyword, admins, virtualClusters));
    }

    /**
     * @param {React.SyntheticEvent} event
     */
    function onClearClick(event) {
      event.preventDefault();
      const {keyword, admins} = filter;
      setFilter(new Filter(keyword, admins, new Set()));
    }

    /**
     * @param {string} key
     * @param {string} text
     * @returns {import('office-ui-fabric-react').IContextualMenuItem}
     */
    function getItem(key) {
      return {
        key,
        text: key,
        canCheck: true,
        checked: filter.virtualClusters.has(key),
        onClick: onClick,
      };
    }

    return {
      key: 'virtualCluster',
      name: 'Virtual Cluster',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {
        iconName: 'CellPhone',
      },
      subMenuProps: {
        items: Object.keys(virtualClusters).map(getItem).concat([{
          key: 'divider',
          itemType: ContextualMenuItemType.Divider,
        },
        {
          key: 'clear',
          text: 'Clear',
          onClick: onClearClick,
        },
        ]),
      },
      commandBarButtonAs: FilterButton,
    };
  }

  const topBarItems = [
    getAddUser(),
    getImportCSV(),
  ];
  const selectedUsers = getSelectedUsers();
  if (selectedUsers.length > 0 && findIndex(selectedUsers, (user) => toBool(user.admin)) == -1) {
    topBarItems.push(getRemove());
  }
  topBarItems.push(getRefresh());
  const topBarFarItems = [getFilters()];

  const filterBarItems = [getKeyword()];
  const filterBarFarItems = [
    getVirtualCluster(),
    getAdmin(),
    getClear(),
  ];

  return (
    <React.Fragment>
      <CommandBar
        items={topBarItems}
        farItems={topBarFarItems}
        styles={{root: {backgroundColor: 'transparent'}}}
      />
      {active ? <CommandBar
        items={filterBarItems}
        farItems={filterBarFarItems}
        styles={{root: {backgroundColor: '#ECECEC'}}}
      /> : null}
    </React.Fragment>
  );
}

export default TopBar;
