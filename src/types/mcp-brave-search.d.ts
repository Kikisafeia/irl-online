declare module '@modelcontextprotocol/server-brave-search' {
  interface Message {
    role: string;
    content: string;
  }

  interface BraveSearchResult {
    content: string | object;
  }

  class BraveSearch {
    constructor(options: { apiKey: string });
    run(messages: Message[]): Promise<BraveSearchResult>;
  }

  export { BraveSearch };
}
