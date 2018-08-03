//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-projects/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @requires      module:???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports


// Interfaces
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

export interface FalconConfig {
  appxProject?:  AppxPackageProjectConfig;
  appxDemo?:     AppxDemoProjectConfig;
}


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxDemoProjectContext
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class AppxDemoProjectContext {
  // Interface
  public config: {
    local:    AppxDemoLocalConfig;
    project:  AppxDemoProjectConfig;
    global:   any;
  }
  public path: string;
  // Constructor
  constructor() {
    this.config = {
      local:    <AppxDemoLocalConfig>{},
      project:  <AppxDemoProjectConfig>{},
      global:   {}
    };
  }
}
