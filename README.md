# the-root-project
Skip to main content
GitHub Docs
Environment variables
In this article
About environment variables
Using contexts to access environment variable values
Naming conventions for environment variables
Default environment variables
Detecting the operating system
Passing values between steps and jobs in a workflow
GitHub sets default environment variables for each GitHub Actions workflow run. You can also set custom environment variables in your workflow file.

About environment variables
You can use environment variables to store information that you want to reference in your workflow. You reference environment variables within a workflow step or an action, and the variables are interpolated on the runner machine that runs your workflow. Commands that run in actions or workflow steps can create, read, and modify environment variables.

You can set your own custom environment variables, you can use the default environment variables that GitHub sets automatically, and you can also use any other environment variables that are set in the working environment on the runner. Environment variables are case-sensitive.

To set a custom environment variable, you must define it in the workflow file. The scope of a custom environment variable is limited to the element in which it is defined. You can define environment variables that are scoped for:

The entire workflow, by using env at the top level of the workflow file.
The contents of a job within a workflow, by using jobs.<job_id>.env.
A specific step within a job, by using jobs.<job_id>.steps[*].env.
name: Greeting on variable day

on:
  workflow_dispatch

env:
  DAY_OF_WEEK: Monday

jobs:
  greeting_job:
    runs-on: ubuntu-latest
    env:
      Greeting: Hello
    steps:
      - name: "Say Hello Mona it's Monday"
        run: echo "$Greeting $First_Name. Today is $DAY_OF_WEEK!"
        env:
          First_Name: Mona
The example above shows three custom environment variables being used in an echo command: $DAY_OF_WEEK, $Greeting, and $First_Name. The values for these environment variables are set, and scoped, at the workflow, job, and step level respectively.

Because environment variable interpolation is done after a workflow job is sent to a runner machine, you must use the appropriate syntax for the shell that's used on the runner. In this example, the workflow specifies ubuntu-latest. By default, Linux runners use the bash shell, so you must use the syntax $NAME. If the workflow specified a Windows runner, you would use the syntax for PowerShell, $env:NAME. For more information about shells, see "Workflow syntax for GitHub Actions."

Note: You can list the entire set of environment variables that are available to a workflow step by using run: env in a step and then examining the output for the step.

Using contexts to access environment variable values
In addition to environment variables, GitHub Actions also allows you to set and read values using contexts. Environment variables and contexts are intended for use at different points in the workflow.

Environment variables are always interpolated on the virtual machine runner. However, parts of a workflow are processed by GitHub Actions and are not sent to the runner. You cannot use environment variables in these parts of a workflow file. Instead, you can use contexts. For example, an if conditional, which determines whether a job or step is sent to the runner, is always processed by GitHub Actions. You can use a context in an if conditional statement to access the value of an environment variable.

env:
  DAY_OF_WEEK: Monday

jobs:
  greeting_job:
    runs-on: ubuntu-latest
    env:
      Greeting: Hello
    steps:
      - name: "Say Hello Mona it's Monday"
        if: ${{ env.DAY_OF_WEEK == 'Monday' }}
        run: echo "$Greeting $First_Name. Today is $DAY_OF_WEEK!"
        env:
          First_Name: Mona
In this modification of the first example, we've introduced an if conditional. The workflow step is now only run if DAYS_OF_WEEK is set to "Monday". We access this value from the if conditional statement by using the env context.

Note: Contexts are usually denoted using the dollar sign and curly braces, as ${{ context.property }}. In an if conditional, the ${{ and }} are optional, but if you use them they must enclose the entire comparison statement, as shown above.

You will commonly use either the env or github context to access environment variable values in parts of the workflow that are processed before jobs are sent to runners.

Context	Use case	Example
env	Reference custom environment variables defined in the workflow.	${{ env.MY_VARIABLE }}
github	Reference information about the workflow run and the event that triggered the run.	${{ github.repository }}
There are many other contexts that you can use for a variety of purposes in your workflows. For more information, see "Contexts." For details of where you can use specific contexts within a workflow, see "Context availability."

Other types of variables
In most places in a workflow, the only types of variables that you can use are either environment variables, such as $MY_VARIABLE, or the equivalent context property, such as ${{ env.MY_VARIABLE }}. Exceptions are:

Inputs for the workflow_call and workflow_dispatch events, which allow you to pass values to a workflow. For more information, see on.workflow_call.inputs and on.workflow_dispatch.inputs.
Job outputs, which allow you to pass values between jobs in a workflow. For more information, see jobs.<job_id>.outputs.
The variables in a format expression, which allow you to replace parts of a string. For more information, see format.
Naming conventions for environment variables
When you set a custom environment variable, you cannot use any of the default environment variable names. For a complete list of these, see "Default environment variables" below. If you attempt to override the value of one of these default environment variables, the assignment is ignored.

Any new environment variables you set that point to a location on the filesystem should have a _PATH suffix. The HOME, GITHUB_ENV, and GITHUB_WORKSPACE default environment variables are exceptions to this convention.

Default environment variables
The default environment variables that GitHub sets are available to every step in a workflow.

We strongly recommend that actions use environment variables to access the filesystem rather than using hardcoded file paths. GitHub sets environment variables for actions to use in all runner environments.

Environment variable	Description
CI	Always set to true.
GITHUB_ACTION	The name of the action currently running, or the id of a step. For example, for an action, __repo-owner_name-of-action-repo.

GitHub removes special characters, and uses the name __run when the current step runs a script without an id. If you use the same script or action more than once in the same job, the name will include a suffix that consists of the sequence number preceded by an underscore. For example, the first script you run will have the name __run, and the second script will be named __run_2. Similarly, the second invocation of actions/checkout will be actionscheckout2.
GITHUB_ACTION_PATH	The path where an action is located. This property is only supported in composite actions. You can use this path to access files located in the same repository as the action. For example, /home/runner/work/_actions/repo-owner/name-of-action-repo/v1.
GITHUB_ACTION_REPOSITORY	For a step executing an action, this is the owner and repository name of the action. For example, actions/checkout.
GITHUB_ACTIONS	Always set to true when GitHub Actions is running the workflow. You can use this variable to differentiate when tests are being run locally or by GitHub Actions.
GITHUB_ACTOR	The name of the person or app that initiated the workflow. For example, octocat.
GITHUB_API_URL	Returns the API URL. For example: https://api.github.com.
GITHUB_BASE_REF	The name of the base ref or target branch of the pull request in a workflow run. This is only set when the event that triggers a workflow run is either pull_request or pull_request_target. For example, main.
GITHUB_ENV	The path on the runner to the file that sets environment variables from workflow commands. This file is unique to the current step and changes for each step in a job. For example, /home/runner/work/_temp/_runner_file_commands/set_env_87406d6e-4979-4d42-98e1-3dab1f48b13a. For more information, see "Workflow commands for GitHub Actions."
GITHUB_EVENT_NAME	The name of the event that triggered the workflow. For example, workflow_dispatch.
GITHUB_EVENT_PATH	The path to the file on the runner that contains the full event webhook payload. For example, /github/workflow/event.json.
GITHUB_GRAPHQL_URL	Returns the GraphQL API URL. For example: https://api.github.com/graphql.
GITHUB_HEAD_REF	The head ref or source branch of the pull request in a workflow run. This property is only set when the event that triggers a workflow run is either pull_request or pull_request_target. For example, feature-branch-1.
GITHUB_JOB	The job_id of the current job. For example, greeting_job.
GITHUB_PATH	The path on the runner to the file that sets system PATH variables from workflow commands. This file is unique to the current step and changes for each step in a job. For example, /home/runner/work/_temp/_runner_file_commands/add_path_899b9445-ad4a-400c-aa89-249f18632cf5. For more information, see "Workflow commands for GitHub Actions."
GITHUB_REF	The branch or tag ref that triggered the workflow run. For branches this is the format refs/heads/<branch_name>, and for tags it is refs/tags/<tag_name>. This variable is only set if a branch or tag is available for the event type. For example, refs/heads/feature-branch-1.
GITHUB_REF_NAME	The branch or tag name that triggered the workflow run. For example, feature-branch-1.
GITHUB_REF_PROTECTED	true if branch protections are configured for the ref that triggered the workflow run.
GITHUB_REF_TYPE	The type of ref that triggered the workflow run. Valid values are branch or tag.
GITHUB_REPOSITORY	The owner and repository name. For example, octocat/Hello-World.
GITHUB_REPOSITORY_OWNER	The repository owner's name. For example, octocat.
GITHUB_RETENTION_DAYS	The number of days that workflow run logs and artifacts are kept. For example, 90.
GITHUB_RUN_ATTEMPT	A unique number for each attempt of a particular workflow run in a repository. This number begins at 1 for the workflow run's first attempt, and increments with each re-run. For example, 3.
GITHUB_RUN_ID	A unique number for each workflow run within a repository. This number does not change if you re-run the workflow run. For example, 1658821493.
GITHUB_RUN_NUMBER	A unique number for each run of a particular workflow in a repository. This number begins at 1 for the workflow's first run, and increments with each new run. This number does not change if you re-run the workflow run. For example, 3.
GITHUB_SERVER_URL	The URL of the GitHub server. For example: https://github.com.
GITHUB_SHA	The commit SHA that triggered the workflow. For example, ffac537e6cbbf934b08745a378932722df287a53.
GITHUB_WORKFLOW	The name of the workflow. For example, My test workflow. If the workflow file doesn't specify a name, the value of this variable is the full path of the workflow file in the repository.
GITHUB_WORKSPACE	The default working directory on the runner for steps, and the default location of your repository when using the checkout action. For example, /home/runner/work/my-repo-name/my-repo-name.
RUNNER_ARCH	The architecture of the runner executing the job. Possible values are X86, X64, ARM, or ARM64.
RUNNER_NAME	The name of the runner executing the job. For example, Hosted Agent
RUNNER_OS	The operating system of the runner executing the job. Possible values are Linux, Windows, or macOS. For example, Windows
RUNNER_TEMP	The path to a temporary directory on the runner. This directory is emptied at the beginning and end of each job. Note that files will not be removed if the runner's user account does not have permission to delete them. For example, D:\a\_temp
RUNNER_TOOL_CACHE	The path to the directory containing preinstalled tools for GitHub-hosted runners. For more information, see "About GitHub-hosted runners". For example, C:\hostedtoolcache\windows
Note:

If you need to use a workflow run's URL from within a job, you can combine these environment variables: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID
Most of the default environment variables have a corresponding, and similarly named, context property. For example, the value of the GITHUB_REF environment variable can be read during workflow processing using the ${{ github.ref }} context property.
Detecting the operating system
You can write a single workflow file that can be used for different operating systems by using the RUNNER_OS default environment variable and the corresponding context property ${{ runner.os }}. For example, the following workflow could be run successfully if you changed the operating system from macos-latest to windows-latest without having to alter the syntax of the environment variables, which differs depending on the shell being used by the runner.

jobs:
  if-Windows-else:
    runs-on: macos-latest
    steps:
      - name: condition 1
        if: runner.os == 'Windows'
        run: echo "The operating system on the runner is $env:RUNNER_OS."
      - name: condition 2
        if: runner.os != 'Windows'
        run: echo "The operating system on the runner is not Windows, it's $RUNNER_OS."

npm installs prerequisites:

$:-cd install dependencies are bash starts:
To run the sample in the browser use the following URL:
http://localhost(5999, 8333)
```

## Insights

Checkout the code inside of:

* ```webapp/model/Model.js```
* ```webapp/model/ListBinding.js```

The Model takes care about loading the data from the server and the ListBinding is the connection to the TreeTable control. Currently the ListBinding is only implemented to fetch the data from the server and to handle expand and collapse. Not more. The implementation is not really smart yet and with more time this complete loading behavior can be optimized in a much better fashion. But it at least sketches the basic idea of using the Model and the ListBinding as just a delegation to a server to load just an excerpt of the data needed for the client.
