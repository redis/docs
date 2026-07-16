Each filter expression has one of the following syntaxes:

  - `label!=` - the time series has a label named `label`
  - `label=value` - the time series has a label named `label` with a value equal to `value`
  - `label=(value1,value2,...)` - the time series has a label named `label` with a value equal to one of the values in the list
  - `label=` - the time series does not have a label named `label`
  - `label!=value` - the time series does not have a label named `label` with a value equal to `value`
  - `label!=(value1,value2,...)` - the time series does not have a label named `label` with a value equal to any of the values in the list

  <note><b>Notes:</b>
   - At least one filter expression with a syntax `label=value` or `label=(value1,value2,...)` is required.
   - Filter expressions are conjunctive. For example, the filter `type=temperature room=study` means that `type=temperature` AND `room=study`.
   - Whitespace is not allowed in a filter expression except between quotes or double quotes in values - for example, `x="y y"` or `x='(y y,z z)'`.
   </note>
