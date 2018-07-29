// TODO: Delete this interface once we see if there's anything we want to borrow.
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

export interface AppxDemoLocalConfig {
  demoValidationOrgAlias: string;
  demoDeploymentOrgAlias: string;
  devHubAlias:            string;
  envHubAlias:            string;
}

export interface AppxDemoProjectConfig {
  demoAlias:        string;
  demoConfig:       string;
  demoTitle:        string;
  demoType:         string;
  demoVersion:      string;
  gitHubUrl:        string;
  gitRemoteUri:     string;
  partnerAlias:     string;
  partnerName:      string;
  schemaVersion:    string;
}

export interface AppxDemoSequenceOptions {
  scratchDefJson:    string;
  skipUserCreation:  boolean;
}

export interface AppxPackageLocalConfig {
  demoValidationOrgAlias: string;
  demoDeploymentOrgAlias: string;
  devHubAlias:            string;
  envHubAlias:            string;
}

export interface AppxPackageProjectConfig {
  gitHubUrl:          string;
  gitRemoteUri:       string;
  metadataPackageId:  string;
  namespacePrefix:    string;
  packageName:        string;
  packageVersionId: {
    stable: string;
    beta:   string;
  }
  partnerAlias:       string;
  partnerName:        string;
  projectAlias:       string;
  projectName:        string;
  projectType:        string;
  schemaVersion:      string;
}

export interface AppxPackageSequenceOptions {
  scratchDefJson:    string;
}

export interface FalconConfig {
  appxProject?:  AppxPackageProjectConfig;
  appxDemo?:     AppxDemoProjectConfig;
}

export interface FalconCommandContext extends FalconSequenceContext {
  commandObserver:  any;
}

// TODO: Need to finish defining FalconCommandHandler
export interface FalconCommandHandler {
  changeMe: string;
}

export interface FalconCommandSequence {
  sequenceName:     string;
  sequenceType:     string;
  sequenceVersion:  string;
  description:      string;
  options:          any;
  sequenceGroups:   [FalconCommandSequenceGroup];
  handlers:         [FalconCommandHandler];
  schemaVersion:    string;
}

export interface FalconCommandSequenceGroup {
  groupName:      string;
  description:    string;
  sequenceSteps:  [FalconCommandSequenceStep];
}

export interface FalconCommandSequenceStep {
  stepName:     string;
  description:  string;
  action:       string;
  options:      any;
  onSuccess?: {
    handler:  string;
  }
  onError?:  {
    handler:  string;
  }
}

export interface FalconJsonResponse {
  status: number;
  result: any;
}

export interface FalconSequenceContext {
  devHubAlias:        string;
  targetOrgAlias:     string;
  targetIsScratchOrg: boolean;
  projectPath:        string;
  configPath:         string;
  mdapiSourcePath:    string;
  dataPath:           string;
  logLevel:           'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  sequenceObserver:   any;
}
