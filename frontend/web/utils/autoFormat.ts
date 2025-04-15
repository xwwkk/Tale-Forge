export class AutoFormatter {
  // 中文标点符号
  private static readonly chinesePunctuations = {
    comma: '，',
    period: '。',
    questionMark: '？',
    exclamationMark: '！',
    colon: '：',
    semicolon: '；',
    leftQuote: '"',
    rightQuote: '"',
    leftBracket: '（',
    rightBracket: '）',
    dash: '——',
    ellipsis: '……'
  };

  // 修复中英文混排的空格
  private static fixChineseEnglishSpacing(text: string): string {
    // 在中文和英文之间添加空格
    text = text.replace(/([\u4e00-\u9fa5])([\w])/g, '$1 $2');
    text = text.replace(/([\w])([\u4e00-\u9fa5])/g, '$1 $2');
    return text;
  }

  // 修复标点符号
  private static fixPunctuation(text: string): string {
    // 替换英文标点为中文标点
    const punctuationMap = {
      ',': this.chinesePunctuations.comma,
      '\\.': this.chinesePunctuations.period,
      '\\?': this.chinesePunctuations.questionMark,
      '!': this.chinesePunctuations.exclamationMark,
      ':': this.chinesePunctuations.colon,
      ';': this.chinesePunctuations.semicolon,
      '"': this.chinesePunctuations.leftQuote,
      '"': this.chinesePunctuations.rightQuote,
      '\\(': this.chinesePunctuations.leftBracket,
      '\\)': this.chinesePunctuations.rightBracket,
      '--': this.chinesePunctuations.dash,
      '\\.{3}': this.chinesePunctuations.ellipsis
    };

    // 替换标点
    Object.entries(punctuationMap).forEach(([en, cn]) => {
      text = text.replace(new RegExp(en, 'g'), cn);
    });

    // 删除重复的标点符号
    const allPunctuations = Object.values(this.chinesePunctuations).join('');
    text = text.replace(new RegExp(`[${allPunctuations}]+`, 'g'), match => match[0]);

    return text;
  }

  // 修复段落格式
  private static fixParagraphs(text: string): string {
    // 分割成段落
    const paragraphs = text.split(/\n+/).filter(p => p.trim());

    // 处理每个段落
    return paragraphs.map(p => {
      // 去除段落首尾空格
      p = p.trim();
      
      // 确保段落以标点符号结尾
      const lastChar = p[p.length - 1];
      const isPunctuation = Object.values(this.chinesePunctuations).includes(lastChar);
      if (!isPunctuation) {
        p += this.chinesePunctuations.period;
      }

      return p;
    }).join('\n\n');
  }

  // 主格式化函数
  public static format(html: string): string {
    // 创建临时 div 来解析 HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 递归处理所有文本节点
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent || '';
        text = this.fixChineseEnglishSpacing(text);
        text = this.fixPunctuation(text);
        return text;
      }

      const element = node as Element;
      let content = Array.from(element.childNodes).map(processNode).join('');

      // 根据标签类型添加换行
      switch (element.tagName?.toLowerCase()) {
        case 'p':
        case 'div':
          content = `\n${content}\n`;
          break;
        case 'br':
          content = '\n';
          break;
      }

      return content;
    };

    // 处理所有内容
    let text = processNode(tempDiv);
    
    // 修复段落格式
    text = this.fixParagraphs(text);

    // 将处理后的文本转换回 HTML
    return text.split('\n\n').map(p => {
      if (!p.trim()) return '';
      return `<p>${p.trim()}</p>`;
    }).join('');
  }
} 