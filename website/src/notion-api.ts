import { Client } from "@notionhq/client";

const notionSecret = "secret_oIzRBRUA2AeuLxrZyCXuZ88hY7rY5A9BO4blWsHMteh";

const notion = new Client({
  auth: notionSecret,
  baseUrl: "http://localhost:8080/https://api.notion.com",
});

export type MultiSelectProperty = {
  type: "multi_select";
  multi_select: {
    id: string;
    name: string;
  }[];
};

export type TitleProperty = {
  type: "title";
  title: [
    {
      plain_text: string;
    }
  ];
};

export type NumberProperty = {
  type: "number";
  number: number;
};

export type NotionProperty =
  | {
      id: string;
      name: string;
      type: "title" | "number" | "multi_select";
    }
  | MultiSelectProperty
  | TitleProperty
  | NumberProperty;

export type PageInfo = {
  id: string;
  properties: Record<string, NotionProperty>;
};

class NotionPage {
  constructor(protected pageInfo: PageInfo) {}

  getPropertyKeys(): string[] {
    return Object.keys(this.pageInfo.properties);
  }

  getProperty(id: string): NotionProperty {
    return this.pageInfo.properties[id];
  }
}

class NotionDatabase extends NotionPage {
  async query(): Promise<NotionPage[]> {
    const result = await notion.databases.query({
      database_id: this.pageInfo.id,
    });

    return result.results.map((r) => new NotionPage(r as any));
  }
}

export async function getNotionDatabase(database_id: string) {
  const result = await notion.databases.retrieve({
    database_id,
  });

  return new NotionDatabase(result as PageInfo);
}

export async function listNotionDatabases() {
  const result = await notion.search({
    filter: {
      value: "database",
      property: "object",
    },
  });

  return result.results.map((page) => new NotionDatabase(page as PageInfo));
}
