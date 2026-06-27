export type ITagDisplayData = {
  name: string;
  emoticon?: string | null;
  color?: string | null;
};

export function formatTagLabel(tag: ITagDisplayData): string {
  return tag.emoticon ? `${tag.emoticon} ${tag.name}` : tag.name;
}
