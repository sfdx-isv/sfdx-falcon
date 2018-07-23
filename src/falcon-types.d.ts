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

export interface AppxDemoConfig {
  demoAlias:        string;
  demoConfigJson:   string;
  demoTitle:        string;
  demoType:         string;
  demoVersion:      string;
  gitHubUrl:        string;
  gitRemoteUri:     string;
  partnerAlias:     string;
  partnerName:      string;
  schemaVersion:    string;
}

export interface AppxProjectConfig {
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

export interface LocalAppxDemoConfig {
  demoValidationOrgAlias: string;
  demoDeploymentOrgAlias: string;
  devHubAlias:            string;
  envHubAlias:            string;
}

export interface FalconConfig {
  appxProject:  any;
  appxDemo:     AppxDemoConfig;
}

export interface FalconCommandSequence {
  handlers:               [FalconCommandHandler];
  schemaVersion:          string;
  sequenceAlias:          string;
  sequenceDescription:    string;
  sequenceName:           string;
  sequenceVersion:        string;
  sequenceSteps:          [FalconCommandSequenceStep];
}

// TODO: Need to finish defining FalconCommandHandler
export interface FalconCommandHandler {
  changeMe: string;
}

export interface FalconCommandSequenceStep {
  action:       string;
  alias:        string;
  description:  string;
  handlers: {
    error:    string;
    success:  string;
  }
  name:         string;
  options:      any;
  type:         string;
}

