import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Process naming
proc_name = "itr_tracker"

# Server mechanics
daemon = False
pidfile = "/tmp/itr_tracker.pid"
umask = 0o022
user = None
group = None
tmpdir = None

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "itr_tracker"

# Server hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    pass

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    pass

def when_ready(server):
    """Called just after the server is ready to serve requests."""
    print("ITR Tracker server is ready. Listening on: %s" % bind)

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    print(f"Worker spawned (pid: {worker.pid})")

def pre_exec(server):
    """Called just before a new master process is forked."""
    pass

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    pass

def worker_abort(worker):
    """Called when a worker receives the SIGABRT signal."""
    pass
