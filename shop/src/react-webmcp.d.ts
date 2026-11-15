/** Lets JSX accept the declarative WebMCP attributes. React passes unknown lowercase attributes to the DOM as they are. */
import 'react';

declare module 'react' {
  interface FormHTMLAttributes<T> {
    /** Makes the form a tool with this name. Needs tooldescription too. */
    toolname?: string;
    tooldescription?: string;
    tooltitle?: string;
    /** Submit as soon as the agent has filled the form, without waiting for a click. In JSX write toolautosubmit="". */
    toolautosubmit?: string;
  }
  interface InputHTMLAttributes<T> {
    /** Describes this field to the agent. Without it, Chrome uses the label's text. */
    toolparamdescription?: string;
  }
  interface SelectHTMLAttributes<T> {
    toolparamdescription?: string;
  }
  interface TextareaHTMLAttributes<T> {
    toolparamdescription?: string;
  }
  interface FieldsetHTMLAttributes<T> {
    toolparamdescription?: string;
  }
}
