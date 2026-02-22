import client from './client'

export const getIssues = (projectId, params) =>
  client.get(`/projects/${projectId}/issues`, { params })

export const createIssue = (projectId, data) =>
  client.post(`/projects/${projectId}/issues`, data)

export const getIssue = (issueId) => client.get(`/issues/${issueId}`)
export const updateIssue = (issueId, data) => client.patch(`/issues/${issueId}`, data)
export const deleteIssue = (issueId) => client.delete(`/issues/${issueId}`)
