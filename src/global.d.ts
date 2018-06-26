// Type definitions for sfdx-falcon-plugin 0.0.1
// Project: SFDX-Falcon CLI Plugin
// Definitions by: Vivek M. Chawla <https://twitter.com/VivekMChawla>

declare module 'yeoman-environment';

interface FalconProjectSettings {
  projectName: string;
  projectType: 'managed1gp' | 'managed2gp' | 'unmanaged' | 'demo' ;
  targetDirectory: string;
  isCreatingManagedPackage: boolean;
  namespacePrefix: string;
  packageName: string;
  packageDirectory: string;
  metadataPackageId: string;
  packageVersionId: string;
  isInitializingGit: boolean;
  hasGitRemoteRepository: boolean;
  gitRemoteUri: string;
}
interface ConfirmationAnswers {
  proceed:  boolean;
  restart:  boolean;
  abort:    boolean;
}