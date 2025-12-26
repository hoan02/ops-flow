import type { NodeTypes } from '@xyflow/react'
import {
  GitLabNode,
  JenkinsNode,
  KubernetesNode,
  SonarQubeNode,
  KeycloakNode,
} from './nodes'

export const nodeTypes: NodeTypes = {
  gitlab: GitLabNode,
  jenkins: JenkinsNode,
  kubernetes: KubernetesNode,
  sonarqube: SonarQubeNode,
  keycloak: KeycloakNode,
}

