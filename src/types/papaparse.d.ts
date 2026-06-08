declare module "papaparse" {
  export interface ParseError {
    message: string;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: unknown;
  }

  export interface ParseConfig {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    transformHeader?: (header: string, index: number) => string;
  }

  export interface UnparseConfig {
    header?: boolean;
    columns?: string[];
  }

  const Papa: {
    parse<T = unknown>(input: string, config?: ParseConfig): ParseResult<T>;
    unparse(data: unknown, config?: UnparseConfig): string;
  };

  export default Papa;
}
