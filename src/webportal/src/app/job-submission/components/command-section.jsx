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
import {BasicSection} from './basic-section';
import PropTypes from 'prop-types';
import {MonacoTextFiled} from './monaco-text-field';
import {FormShortSection} from './form-page';
import {PAI_ENV_VAR} from '../utils/constants';

export const CommandSection = (props) => {
  const {onChange, value} = props;

  const _onChange = (newValue) => {
    if (onChange !== undefined) {
      onChange(newValue);
    }
  };

  return (
    <BasicSection sectionLabel={'Command'}>
      <FormShortSection>
        <MonacoTextFiled
          monacoProps={{height: 200}}
          value={value}
          onChange={_onChange}
          completionItems={[...PAI_ENV_VAR.map((x) => `$${x.key}`)]}
        />
      </FormShortSection>
    </BasicSection>
  );
};

CommandSection.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
};
