pipeline {
    agent { docker 'node:6.3' }
    stages {
        stage('build') {
            steps {
                sh 'ls ../../'
                sh 'ls'
                sh '''
                    echo "Multiline shell steps works too"
                    ls -lah
                '''
                sh 'npm --version'
            }
        }
    }
}