import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AdminDashboardPage from './page'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({ 'data-testid': 'admin-upload-dropzone' }),
    getInputProps: () => ({ 'data-testid': 'admin-upload-file-input', type: 'file' }),
    isDragActive: false,
  }),
}))

describe('AdminDashboardPage', () => {
  it('renders the dashboard with correct layout', () => {
    render(<AdminDashboardPage />)
    
    // Check if the dashboard header is present
    expect(screen.getByText('HC PM Dashboard')).toBeInTheDocument()
    
    // Check for operational metrics
    expect(screen.getByText('Active Period')).toBeInTheDocument()
    expect(screen.getByText('Last Cut-Off Date')).toBeInTheDocument()
    expect(screen.getByText('Pending Redemptions')).toBeInTheDocument()
    
    // Check for upload module
    expect(screen.getByText('Monthly Upload Module')).toBeInTheDocument()
    expect(screen.getByTestId('admin-upload-dropzone')).toBeInTheDocument()
    expect(screen.getByTestId('admin-upload-file-input')).toBeInTheDocument()
    
    // Check for redemption management table
    expect(screen.getByText('Redemption Requests')).toBeInTheDocument()
    expect(screen.getByText('Alice Optel')).toBeInTheDocument()
  })

  it('contains the upload dropzone', () => {
    render(<AdminDashboardPage />)
    expect(screen.getByTestId('admin-upload-dropzone')).toBeInTheDocument()
  })
})
