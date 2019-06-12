/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React from 'react';
import {Fabric, Stack, initializeIcons, StackItem, getTheme} from 'office-ui-fabric-react';
import {TabFormContent} from './tab-form-content';
import {JobTaskRole} from '../models/job-task-role';
import {JobInformation} from './job-information';
import {Parameters} from './parameters';
import {getFormClassNames} from './form-style';
import {initTheme} from '../../../app/components/theme';
import {JobBasicInfo} from '../models/job-basic-info';
import {SubmissionSection} from './submission-section';
import {TaskRoles} from './task-roles';
import t from '../../../app/components/tachyons.scss';

initTheme();
initializeIcons();

const {spacing} = getTheme();

export class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      jobTaskRoles: [new JobTaskRole({})],
      parameters: [],
      jobInformation: new JobBasicInfo({}),
    };
  }

  _onRenderTabContent(keyName, content, defaultOnContentChange) {
    return (
      <TabFormContent key={keyName} defaultValue={content} onContentChange={defaultOnContentChange}/>
    );
  }

  render() {
    const {jobTaskRoles, parameters, jobInformation} = this.state;
    const formLayout = getFormClassNames().formLayout;
    const topForm = getFormClassNames().topForm;

    return (
      <Fabric>
        <Stack className={formLayout}>
          <Stack horizontal gap='l2'>
            <StackItem grow styles={{root: {overflow: 'auto'}}}>
              <Stack gap='l2'>
                <StackItem className={topForm}>
                  <JobInformation jobInformation={jobInformation}
                                  onChange={(jobInformation) => this.setState({jobInformation: jobInformation})}/>
                </StackItem>
                <StackItem className={topForm}>
                  <Stack gap='l1'>
                    <TaskRoles taskRoles={jobTaskRoles}
                               onChange={(jobTaskRoles) => this.setState({jobTaskRoles: jobTaskRoles})}/>
                    <SubmissionSection jobInformation={jobInformation}
                                       jobTaskRoles={jobTaskRoles}
                                       parameters={parameters}
                                       onChange={(updatedJobInfo, updatedTaskRoles, updatedParameters) => this.setState({
                                         jobTaskRoles: updatedTaskRoles,
                                         parameters: updatedParameters,
                                         jobInformation: updatedJobInfo,
                                       })}/>
                  </Stack>
                </StackItem>
              </Stack>
            </StackItem>
            <StackItem disableShrink styles={{root: [t.w30]}}>
              <Stack className={topForm} styles={{root: {position: 'fixed',
                     maxHeight: '80%', overflow: 'auto', marginRight: spacing.l1}}}>
                <Parameters parameters={parameters}
                            environment={[]}
                            onChange={(parameters) => this.setState({parameters: parameters})}/>
              </Stack>
            </StackItem>
          </Stack>
        </Stack>
      </Fabric>
    );
  }
}
