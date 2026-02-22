import client from './client'

export const getProjects = () => client.get('/projects')
export const createProject = (data) => client.post('/projects', data)
export const addMember = (projectId, data) => client.post(`/projects/${projectId}/members`, data)
export const getMembers = (projectId) => client.get(`/projects/${projectId}/members`)
