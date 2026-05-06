import { Project, SourceFile, InterfaceDeclaration, TypeAliasDeclaration, PropertySignature, MethodDeclaration } from 'ts-morph';
import type { KnowledgePoint } from '../types.js';

export class ASTParser {
  private project: Project;

  constructor(tsConfigPath?: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        strict: true,
        esModuleInterop: true,
        target: 99,
        module: 99,
        moduleResolution: 2,
      },
    });
  }

  addSourceFile(filePath: string): SourceFile {
    return this.project.addSourceFileAtPath(filePath);
  }

  extractInterfaceProperties(
    filePath: string,
    interfaceName: string
  ): KnowledgePoint[] {
    const sourceFile = this.addSourceFile(filePath);
    const iface = sourceFile.getInterface(interfaceName);
    if (!iface) return [];

    return iface.getProperties().map((prop: PropertySignature) => ({
      id: `${filePath}::${interfaceName}::${prop.getName()}`,
      dimension: '',
      subcategory: interfaceName,
      title: prop.getName(),
      content: this.formatPropertyInfo(prop),
      codeSnippet: prop.getText(),
      source: filePath,
      sourcePath: filePath,
      tags: [interfaceName, prop.getName()],
    }));
  }

  extractAllInterfaces(filePath: string): KnowledgePoint[] {
    const sourceFile = this.addSourceFile(filePath);
    const results: KnowledgePoint[] = [];

    sourceFile.getInterfaces().forEach((iface) => {
      const props = iface.getProperties().map((prop: PropertySignature) => ({
        name: prop.getName(),
        type: prop.getType().getText(prop),
        optional: prop.hasQuestionToken(),
        jsDoc: prop.getJsDocs()?.[0]?.getDescription() || '',
      }));

      results.push({
        id: `${filePath}::${iface.getName()}`,
        dimension: '',
        subcategory: iface.getName(),
        title: iface.getName(),
        content: JSON.stringify(props, null, 2),
        codeSnippet: iface.getText(),
        source: filePath,
        sourcePath: filePath,
        tags: [iface.getName()],
      });
    });

    return results;
  }

  private formatPropertyInfo(prop: PropertySignature): string {
    const name = prop.getName();
    const type = prop.getType().getText(prop);
    const optional = prop.hasQuestionToken() ? '（可选）' : '（必填）';
    const jsDoc = prop.getJsDocs()?.[0]?.getDescription() || '';
    return `${name}: ${type}${optional}${jsDoc ? ' - ' + jsDoc : ''}`;
  }
}
